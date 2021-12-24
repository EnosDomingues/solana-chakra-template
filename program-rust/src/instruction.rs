use borsh::BorshDeserialize;
use crate::state::Message;
use solana_program::sysvar::slot_history::ProgramError;
use crate::error::AccountError::InvalidInstruction;

#[derive(Debug)]
pub enum AccountInstruction {
  /// Send Message
  ///
  /// Accounts expected
  ///
  /// 1. `[writable]` The account that will have the messages
  SendMessage { 
    sender: String,
    message: String,
    sent_date: String,
  },
}

impl AccountInstruction {

  pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
    let message_account = Message::try_from_slice(input).unwrap();

    Ok(match message_account.id {
      0 => Self::SendMessage {
        sender: message_account.sender,
        message: message_account.message,
        sent_date: message_account.sent_date,
      },
      _ => return Err(InvalidInstruction.into()),
    })
  }
}