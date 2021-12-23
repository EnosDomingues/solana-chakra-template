use thiserror::Error;
use solana_program::program_error::ProgramError;

#[derive(Error, Debug, Copy, Clone)]
pub enum AccountError {
  #[error("Invalid Instruction")]
  InvalidInstruction,
}

impl From<AccountError> for ProgramError {
  fn from(e: AccountError) -> Self {
    ProgramError::Custom(e as u32)
  }
}