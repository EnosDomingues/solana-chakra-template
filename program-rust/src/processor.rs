use crate::state::Message;
use crate::state::MessageAccount;
use crate::instruction::AccountInstruction;
use borsh::BorshSerialize;
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
    
    let message_obj = Message {
      id: 0,
      sender,
      message,
      sent_date,
    };

    let mut vec = Vec::new();
    vec.push(message_obj);

    let messages = MessageAccount {
      sent: vec,
    };

    messages.serialize(&mut &mut account.data.borrow_mut()[..])?;

    msg!("Sender: {:?}", messages);

  Ok(())
}
}