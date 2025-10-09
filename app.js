// --- 0. Initialize Firebase Services ---

// Get Firebase services initialized in index.html
// 'app' is the variable holding the initialized Firebase app instance
const auth = app.auth();
const db = app.firestore(); // We use Firestore to check user's 'isPro' status


// --- 1. Get DOM Elements ---

const signInButton = document.getElementById('signInButton');
const signOutButton = document.getElementById('signOutButton');
const contentStatus = document.getElementById('content-status');
const proContentDiv = document.getElementById('proContent');
const shopNowButton = document.getElementById('shopNowButton');


// --- 2. SIGN IN / SIGN OUT LOGIC ---

// Google Auth Provider
const provider = new firebase.auth.GoogleAuthProvider();

// Sign In function: starts the popup flow
function handleSignIn() {
    auth.signInWithPopup(provider)
        .then((result) => {
            // User successfully signed in.
            // The onAuthStateChanged listener will automatically run next.
            console.log("Sign-in successful:", result.user.uid);
        })
        .catch((error) => {
            // Handle Errors here (e.g., user closing the popup, network error)
            console.error("Sign-in error:", error.code, error.message);
            contentStatus.textContent = `Sign-in failed. Check console for details.`;
        });
}

// Sign Out function
function handleSignOut() {
    auth.signOut()
        .then(() => {
            // User successfully signed out.
            // The onAuthStateChanged listener will automatically run next.
            console.log("User signed out.");
        })
        .catch((error) => {
            console.error("Sign-out error:", error);
        });
}

// Attach event listeners to the buttons
if (signInButton) signInButton.addEventListener('click', handleSignIn);
if (signOutButton) signOutButton.addEventListener('click', handleSignOut);


// --- 3. USER AUTHENTICATION STATE LISTENER ---

// This function runs every time the user's login state changes (sign in, sign out, page load)
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        contentStatus.textContent = `Welcome, ${user.displayName || user.email}! Checking access...`;
        
        // Hide Sign In, Show Sign Out
        signInButton.style.display = 'none';
        signOutButton.style.display = 'inline-block';
        
        // **CRITICAL STEP:** Check Firestore for 'pro' status
        checkProAccess(user.uid);

    } else {
        // User is signed out (or logged out)
        contentStatus.textContent = "Please sign in to check your access.";
        
        // Show Sign In, Hide Sign Out
        signInButton.style.display = 'inline-block';
        signOutButton.style.display = 'none';
        
        // Hide PRO Content and revert button text
        proContentDiv.style.display = 'none';
        shopNowButton.textContent = 'Shop Now';
    }
});


// --- 4. FIRESTORE ACCESS CHECK LOGIC ---

// Function to check Firestore database for user's 'isPro' status
function checkProAccess(userId) {
    // Look up the user's document in the 'users' collection
    db.collection('users').doc(userId).get()
        .then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                const isPro = userData.isPro === true;

                if (isPro) {
                    // *** USER HAS PRO ACCESS ***
                    contentStatus.textContent = `PRO Access Granted!`;
                    proContentDiv.style.display = 'block'; // Show the PRO download links
                    shopNowButton.textContent = 'View Presets'; // Change Shop button text
                } else {
                    // *** USER DOES NOT HAVE PRO ACCESS ***
                    contentStatus.textContent = `Access: Basic (Sign in to unlock PRO features)`;
                    proContentDiv.style.display = 'none';
                    shopNowButton.textContent = 'Upgrade to PRO'; // Encourage upgrade
                }
            } else {
                // User document does not exist (they signed in for the first time)
                contentStatus.textContent = `Access: Basic. (Upgrade to PRO to unlock features)`;
                proContentDiv.style.display = 'none';
                shopNowButton.textContent = 'Upgrade to PRO';
            }
        })
        .catch((error) => {
            console.error("Error fetching user document:", error);
            contentStatus.textContent = "Error checking access. Try again.";
        });
}
