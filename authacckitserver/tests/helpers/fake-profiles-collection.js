// This file contains a helper function to create a fake profiles collection for testing purposes. The collection is implemented as an in-memory Map, and provides methods to delete a profile and find and update a profile. The findOneAndUpdate method supports upserting a new profile if it does not exist, and updating an existing profile with new data.
export function createFakeProfilesCollection() {
  const documents = new Map();

  return {
    documents,
    deleteOne: async ({ userId }) => ({ deletedCount: documents.delete(userId) ? 1 : 0 }),
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