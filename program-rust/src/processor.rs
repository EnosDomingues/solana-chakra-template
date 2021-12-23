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
      AccountInstruction::ChangeName { account_name } => {
        msg!("Instruction: ChangeName");
        Self::process_change_account_name(accounts, program_id, account_name)
      }
    }
  }

  fn process_change_account_name(
    accounts: &[AccountInfo],
    program_id: &Pubkey,
    account_name: String,
  ) -> ProgramResult {

    msg!("Starting program: {}", program_id);

    // Iterating accounts is safer then indexing
    let accounts_iter = &mut accounts.iter();

    // Get the account
    let account = next_account_info(accounts_iter)?;

    // The account must be owned by the program in order to modify its data
    if account.owner != program_id {
        msg!("Account does not have the correct program id");
        return Err(ProgramError::IncorrectProgramId);
    }

    msg!("Account name: {}", account_name);

  Ok(())
}
}