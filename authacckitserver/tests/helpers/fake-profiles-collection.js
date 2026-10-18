// This file exports a function that creates a fake profiles collection for testing purposes. The collection is an in-memory store that simulates the behavior of a real database collection. It has a `documents` map to store profile documents by userId, and a `findOneAndUpdate` method that mimics the behavior of the MongoDB method with support for upsert and update operations. This allows tests to run without needing a real database connection, making them faster and more reliable.
export function createFakeProfilesCollection() {
  const documents = new Map();

  return {
    documents,
    findOneAndUpdate: async ({ userId }, update, { upsert = false } = {}) => {
      let document = documents.get(userId);

      if (!document && upsert) {
        document = { userId, ...update.$setOnInsert };
        documents.set(userId, document);
      }
      if (document && update.$set) {
        Object.assign(document, update.$set);
      }
      return document ?? null;
    },
  };
}