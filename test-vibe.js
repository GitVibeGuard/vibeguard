// 🧪 GitVibeGuard Test File

// Risk 1: Plaintext secret token leak
const stripe_api_key = "sk_live_51NxB2fakeTokenDoNotUse99xYz828182";

function processUserData(users) {
  console.log("Processing user batch...");

  // Risk 2: High-risk billing / token bleed loop
  users.forEach(user => {
    // Making a live network fetch request inside a loop without rate limiting
    fetch(`https://vibecheck.dev{user.id}/sync`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${stripe_api_key}` }
    });
  });

  // Risk 3: Unbounded infinite loop risk
  while (true) {
    let tasks = getPendingTasks();
    if (!tasks) {
      // Missing a clear deterministic break statement here!
      console.log("No tasks, waiting...");
    } else {
      execute(tasks);
    }
  }
}

function getPendingTasks() {
  return null;
}

function execute(tasks) {
  return true;
}
