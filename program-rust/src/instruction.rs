use borsh::BorshDeserialize;
use crate::state::Account;
use solana_program::sysvar::slot_history::ProgramError;
use crate::error::AccountError::InvalidInstruction;

#[derive(Debug)]
pub enum AccountInstruction {
  /// Change account name
  ///
  /// Accounts expected
  ///
  /// 1. `[writable]` The account that will have the name updated
  ChangeName { account_name: String },
}

impl AccountInstruction {

  pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
    let program_account = Account::try_from_slice(input).unwrap();

    Ok(match program_account.id {
      0 => Self::ChangeName {
        account_name: program_account.account_name
      },
      _ => return Err(InvalidInstruction.into()),
    })
  }
}