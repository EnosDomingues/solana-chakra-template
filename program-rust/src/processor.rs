use solana_program::borsh::get_instance_packed_len;
use borsh::BorshDeserialize;
use crate::state::DataLength;
use borsh::BorshSerialize;
use crate::state::Message;
use crate::state::MessageAccount;
use crate::instruction::AccountInstruction;
use solana_program::{
  account_info::{next_account_info, AccountInfo},
  entrypoint::ProgramResult,
  program_error::ProgramError,
  msg,
  pubkey::Pubkey,
};

pub struct Processor;
impl Processor {
    pub fn process(
      program_id: &Pubkey,
      accounts: &[AccountInfo],
      instruction_data: &[u8],
    ) -> ProgramResult {
    let instruction = AccountInstruction::unpack(instruction_data)?;

    match instruction {
      AccountInstruction::SendMessage { sender, message, sent_date } => {
        Self::process_send_message(accounts, program_id, sender, message, sent_date)
      }
    }
  }

  fn process_send_message(
    accounts: &[AccountInfo],
    program_id: &Pubkey,
    sender: String,
    message: String,
    sent_date: String,
  ) -> ProgramResult {

    
    // Iterating accounts is safer then indexing
    let accounts_iter = &mut accounts.iter();
    
    // Get the account
    let account = next_account_info(accounts_iter)?;
    
    // The account must be owned by the program in order to modify its data
    if account.owner != program_id {
      msg!("Account does not have the correct program id");
      return Err(ProgramError::IncorrectProgramId);
    }

    let message = Message {
      id: 0,
      sender,
      message,
      sent_date,
    };

    let offset: usize = 4;

    let data_length = DataLength::try_from_slice(&account.data.borrow()[..offset])?;
  
    let mut account_data;
    if data_length.length > 0 {
      let length = usize::try_from(data_length.length + u32::try_from(offset).unwrap()).unwrap();
      account_data = MessageAccount::try_from_slice(&account.data.borrow()[offset..length])?;
    } else {
      account_data = MessageAccount {
        sent: Vec::new(),
      };
    }
  
    account_data.sent.push(message);
    let data_length = DataLength {
      length: u32::try_from(get_instance_packed_len(&account_data)?).unwrap(),
    };

    data_length.serialize(&mut &mut account.data.borrow_mut()[..offset])?;
    account_data.serialize(&mut &mut account.data.borrow_mut()[offset..])?;

  Ok(())
}
}