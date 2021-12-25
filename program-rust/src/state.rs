use borsh::{BorshDeserialize, BorshSerialize};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct Message {
    pub id: u8,
    pub sender: String,
    pub message: String,
    pub sent_date: String,
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct MessageAccount {
    pub sent: Vec<Message>,
}

#[derive(BorshDeserialize, BorshSerialize, Debug)]
pub struct DataLength {
  pub length: u32,
}

