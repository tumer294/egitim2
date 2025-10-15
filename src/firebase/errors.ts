export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any;
};

const FIRESTORE_PERMISSION_ERROR_NAME = 'FirestorePermissionError';

export class FirestorePermissionError extends Error {
  context: SecurityRuleContext;
  
  constructor(context: SecurityRuleContext) {
    const message = `FirestorePermissionError: Insufficient permissions for ${context.operation} on ${context.path}.`;
    super(message);
    this.name = FIRESTORE_PERMISSION_ERROR_NAME;
    this.context = context;
    
    // This is to ensure that the error is properly serialized when passed to Next.js overlay
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
