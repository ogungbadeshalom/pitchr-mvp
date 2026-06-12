import supertokens from 'supertokens-node';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import ThirdParty from 'supertokens-node/recipe/thirdparty';
import ThirdPartyEmailPassword from 'supertokens-node/recipe/thirdpartyemailpassword';
import Session from 'supertokens-node/recipe/session';
import { logger } from '../utils/logger';
import { upsertUser } from '../database/queries';

export function initSuperTokens() {
  const connectionUri = process.env.SUPERTOKENS_URI || 'http://localhost:3567';

  const googleProvider = () => ({
    config: {
      thirdPartyId: 'google',
      name: 'Google',
      clients: [{
        clientId: process.env.GOOGLE_CLIENT_ID || 'placeholder',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder',
      }],
    },
  });

  supertokens.init({
    supertokens: {
      connectionURI: connectionUri,
      apiKey: process.env.SUPERTOKENS_API_KEY || undefined,
    },
    appInfo: {
      appName: 'Pitchr',
      apiDomain: process.env.API_URL || 'http://localhost:5001',
      websiteDomain: process.env.FRONTEND_URL || 'http://localhost:3000',
      apiBasePath: '/api/auth',
      websiteBasePath: '/auth',
    },
    recipeList: [
      EmailPassword.init({
        override: {
          apis: (originalImplementation) => ({
            ...originalImplementation,
            signUpPOST: async (input) => {
              const response = await originalImplementation.signUpPOST!(input);
              if (response.status === 'OK') {
                try {
                  const firstName = input.formFields?.find((f: { id: string }) => f.id === 'first_name')?.value;
                  const lastName = input.formFields?.find((f: { id: string }) => f.id === 'last_name')?.value;
                  await upsertUser(response.user.id, response.user.emails[0], firstName, lastName);
                } catch (err) {
                  logger.error('Failed to create user in database', err);
                }
              }
              return response;
            },
            signInPOST: async (input) => {
              const response = await originalImplementation.signInPOST!(input);
              if (response.status === 'OK') {
                try {
                  await upsertUser(response.user.id, response.user.emails[0]);
                } catch (err) {
                  logger.error('Failed to sync user in database', err);
                }
              }
              return response;
            },
          }),
        },
      }),
      ThirdParty.init({
        signInAndUpFeature: {
          providers: [googleProvider()],
        },
      }),
      ThirdPartyEmailPassword.init({
        providers: [googleProvider()],
        override: {
          apis: (originalImplementation) => ({
            ...originalImplementation,
            thirdPartySignInUpPOST: async (input) => {
              const response = await originalImplementation.thirdPartySignInUpPOST!(input);
              if (response.status === 'OK') {
                try {
                  const user = response.user;
                  await upsertUser(user.id, user.emails[0]);
                } catch (err) {
                  logger.error('Failed to upsert user after Google sign-in', err);
                }
              }
              return response;
            },
          }),
        },
      }),
      Session.init(),
    ],
  });

  logger.info('SuperTokens initialized');
}
