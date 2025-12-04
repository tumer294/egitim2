import * as admin from 'firebase-admin';

let adminDb: admin.firestore.Firestore;
let adminAuth: admin.auth.Auth;

function initializeAdmin() {
    // Check if the app is already initialized to prevent re-initialization
    if (admin.apps.length === 0) {
        try {
            const privateKey = process.env.FIREBASE_PRIVATE_KEY;
            const projectId = process.env.FIREBASE_PROJECT_ID;
            const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

            // Check if all required environment variables are present
            if (!privateKey || !projectId || !clientEmail) {
                const missingVars = [
                    !projectId && 'FIREBASE_PROJECT_ID',
                    !clientEmail && 'FIREBASE_CLIENT_EMAIL',
                    !privateKey && 'FIREBASE_PRIVATE_KEY'
                ].filter(Boolean).join(', ');
                
                throw new Error(
                    `Required environment variable(s) are missing: ${missingVars}. ` +
                    'Please check your .env file and hosting provider settings. See docs/FIREBASE_ADMIN_SETUP.md for instructions.'
                );
            }

            // Initialize the app with credentials
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: projectId,
                    clientEmail: clientEmail,
                    // Replace escaped newlines with actual newlines
                    privateKey: privateKey.replace(/\\n/g, '\n'),
                }),
            });
        } catch (error: any) {
            console.error('CRITICAL: Firebase Admin SDK initialization failed.', error);
            // Re-throw a more informative error for the developer
            throw new Error(`Firebase Admin SDK initialization failed. See server logs for details. Error: ${error.message}`);
        }
    }
    // Assign instances if they don't exist
    if (!adminDb) {
        adminDb = admin.firestore();
    }
    if (!adminAuth) {
        adminAuth = admin.auth();
    }
}

// Initialize on module load, but handle potential errors gracefully
try {
    initializeAdmin();
} catch (e: any) {
    console.error("Initial Firebase Admin SDK setup failed on module load. This may be expected during build. Will try again on-demand.", e.message);
}

// Export getter functions that ensure initialization before use
export const getAdminDb = (): admin.firestore.Firestore => {
    if (!adminDb) {
        console.warn("getAdminDb: Firebase Admin was not pre-initialized. Attempting on-demand initialization.");
        initializeAdmin();
    }
    return adminDb;
};

export const getAdminAuth = (): admin.auth.Auth => {
    if (!adminAuth) {
        console.warn("getAdminAuth: Firebase Admin was not pre-initialized. Attempting on-demand initialization.");
        initializeAdmin();
    }
    return adminAuth;
};
