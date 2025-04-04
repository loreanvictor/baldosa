///
/// A macro for committing a set transactions to the ledger, storing
/// them into the database. The macro will return an array of persisted
/// transactions (with generated transaction ids).
///
/// This macro can only be invoked in `async` contexts, and will
/// await the completion of the database transaction. All transactions
/// will be committed via a single insert query for efficiency.
///
/// ### Example:
/// ```rs
/// let [tx1, tx2] = commit_transactions!(ledger; tx1, tx2)?;
/// ```
/// Or with error handling:
/// ```rs
/// match commit_transactions!(ledger; tx1, tx2) {
///   Ok([tx1, tx2]) => { ... },
///   Err(_) => { ... },
/// }
/// ```
/// ### Returns:
/// `Result<[Transaction; N], sqlx::Error>`, when given `N` transactions.
///
#[macro_export]
macro_rules! commit_tx {
  [$($tx:expr),*; to $ledger:expr] => {
    $ledger.store([$($tx),*]).await
  }
}

///
/// A macro for creating a transaction.
///
/// ### Usage:
/// #### Initializing an Account:
/// 👉 initialize an account with given initial value:
/// ```rs
/// tx! { => account; using 10; by issuer }
/// ```
/// - account is an `Account`,
/// - issuer is an `AuthenticatedUser`.
/// ---
/// #### Transferring Money:
/// 👉 spend a transaction to offer money from some sender to some receiver:
/// ```rs
/// tx! { sender => receiver; using consumed, amount; by issuer }
/// tx! { sender => receiver; using consumed, amount; by issuer, note }
/// ```
/// - sender and receiver are `Account`s,
/// - consumed is of type `Transaction`,
/// - issuer is an `AuthenticatedUser`.
/// ---
/// #### Merging Transactions:
/// 👉 merge a transaction into a user's state:
/// ```rs
/// tx! { merge consumed => state; by issuer }
/// tx! { merge consumed => state; using amount; by issuer }
/// ```
/// - consumed and state are `Transaction`s,
/// - issuer is an `AuthenticatedUser`.
///
#[macro_export]
macro_rules! tx {
  (=> $acc:expr; using $amount:expr; by $issuer:expr) => {
    {
      let _a = $acc;
      let _i = $issuer;

      let (receiver, receiver_sys) = match _a {
        Account::User(id) => (Some(id.clone()), None),
        Account::System(sys) => (None, Some(sys.clone())),
        _ => (None, None),
      };

      Transaction {
        receiver, receiver_sys,
        consumed_value: $amount as i32,
        issued_by: _i.id,
        ..Default::default()
      }
    }
  };

  ($sender:expr => $receiver:expr; using $consumed:expr, $amount:expr; by $issuer:expr, $note:literal) => {
    tx!($sender => $receiver; using $consumed, $amount; by $issuer, Some($note.to_string()))
  };

  ($sender:expr => $receiver:expr; using $consumed:expr, $amount:expr; by $issuer:expr, $note:expr) => {
    {
      let _s = $sender;
      let _r = $receiver;
      let _i = $issuer;
      let _c = $consumed;

      let (sender, sender_sys) = match _s {
        Account::User(id) => (Some(id.clone()), None),
        Account::System(sys) => (None, Some(sys.clone())),
        _ => (None, None),
      };

      let (receiver, receiver_sys) = match _r {
        Account::User(id) => (Some(id.clone()), None),
        Account::System(sys) => (None, Some(sys.clone())),
        _ => (None, None),
      };

      Transaction {
        consumes: _c.id,
        consumed_value: $amount as i32,
        sender, sender_sys, receiver, receiver_sys,
        note: $note,
        issued_by: _i.id,
        ..Default::default()
      }
    }
  };

  ($sender:expr => $receiver:expr; using $consumed:expr, $amount:expr; by $issuer:expr) => {
    tx!($sender => $receiver; using $consumed, $amount; by $issuer, None)
  };

  (merge $offer:expr => $state:expr; using $amount:expr; by $issuer:expr, $note:literal) => {
    tx!(merge $offer => $state; using $amount; by $issuer, Some($note.to_string()))
  };

  (merge $offer:expr => $state:expr; using $amount:expr; by $issuer:expr, $note:expr) => {
    {
      let _o = $offer;
      let _s = $state;
      let _i = $issuer;

      Transaction {
        consumes: _o.id,
        consumed_value: u32::min($amount, _o.total()) as i32,
        sender: _s.receiver,
        sender_sys: _s.receiver_sys.clone(),
        receiver: _s.receiver,
        receiver_sys: _s.receiver_sys.clone(),
        merges: _s.id,
        merged_value: _s.total() as i32,
        issued_by: _i.id,
        note: $note,
        ..Default::default()
      }
    }
  };

  (merge $offer:expr => $state:expr; using $amount:expr; by $issuer:expr) => {
    tx!(merge $offer => $state; using $amount; by $issuer, None)
  };

  (merge $offer:expr => $state:expr; by $issuer:expr, $note:expr) => {
    {
      let _o = $offer;
      tx!(merge $offer => $state; using _o.total(); by $issuer, $note)
    }
  };

  (merge $offer:expr => $state:expr; by $issuer:expr) => {
    tx!(merge $offer => $state; by $issuer, None)
  };
}
