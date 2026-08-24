import type { UserData, ApiResponse } from '@/types/index';
import { airtableFetch } from '@/functions/server/core/fetch';
import { logger } from '@/functions/server/core/logger';

// Get user by Airtable record ID (fast direct lookup)
export async function getUserByRecordId(recordId: string): Promise<ApiResponse<UserData>> {
  try {
    if (!recordId) {
      return {
        success: false,
        error: 'Record ID is required'
      };
    }

    logger.debug('Fetching user by record ID', { recordId });
    
    const response = await airtableFetch(
      `People/${recordId}`,
      {
        method: 'GET',
        timeout: 3000
      }
    );

    const record = response.data;
    
    if (!record || !record.fields) {
      logger.warn('User record not found', { recordId });
      return {
        success: false,
        error: 'User not found in Airtable'
      };
    }

    // Validate required fields
    if (!record.fields["Portal ID"] || !record.fields["Email"]) {
      logger.error('User record missing required fields', { recordId, fields: record.fields });
      return {
        success: false,
        error: 'User record is missing required fields'
      };
    }

    const userData: UserData = {
      id: record.id,
      uid: record.fields["Portal ID"],
      email: record.fields["Email"],
      fullName: record.fields["Full Name"] || '',
      firstName: record.fields["First Name"] || '',
      lastName: record.fields["Last Name"] || '',
      role: record.fields["Role"] || '',
      organization: record.fields["Feed Organisation"] || '',
      phone: record.fields["Phone"] || '',
      address: record.fields["Address"] || '',
      city: record.fields["City"] || '',
      postcode: record.fields["Postcode"] || '',
      country: record.fields["Country"] || '',
      createdAt: record.createdTime || '',
      updatedAt: record.fields["Last Modified"] || '',
      isActive: record.fields["Portal"] === "Active",
      activationKey: record.fields["Portal Activation Key"] || '',
      applications: record.fields["Applications"] || [],
      recordId: record.id
    };

    return {
      success: true,
      data: userData
    };
  } catch (error: any) {
    logger.error('Error fetching user by record ID', { recordId, error: error.message });
    return {
      success: false,
      error: error.message || 'Failed to fetch user data'
    };
  }
}

// Get user by Firebase UID (slow filtered query - kept for backwards compatibility)
export async function getUserByUid(uid: string): Promise<ApiResponse<UserData>> {
  try {
    if (!uid) {
      return {
        success: false,
        error: 'User ID is required'
      };
    }

    logger.debug('Fetching user by UID', { uid });

    const response = await airtableFetch(
      "People/listRecords",
      {
        method: 'POST',
        body: JSON.stringify({
          'filterByFormula': `{Portal ID}="${uid}"`
        })
      }
    );

    const data = response.data;
    const userRecord = data.records?.[0];

    if (!userRecord) {
      logger.warn('User not found in Airtable', { uid });
      return {
        success: false,
        error: 'User not found in Airtable'
      };
    }

    // Validate required fields
    if (!userRecord.fields["Portal ID"] || !userRecord.fields["Email"]) {
      logger.error('User record missing required fields', { uid, fields: userRecord.fields });
      return {
        success: false,
        error: 'User record is missing required fields'
      };
    }

    const userData: UserData = {
      id: userRecord.id,
      uid: userRecord.fields["Portal ID"],
      email: userRecord.fields["Email"],
      fullName: `${userRecord.fields["First Name"]} ${userRecord.fields["Last Name"]}`,
      firstName: userRecord.fields["First Name"],
      lastName: userRecord.fields["Last Name"],
      role: userRecord.fields["Role"],
      organization: userRecord.fields["Feed Organisation"],
      phone: userRecord.fields["Phone"],
      address: userRecord.fields["Address"],
      city: userRecord.fields["City"],
      postcode: userRecord.fields["Postcode"],
      country: userRecord.fields["Country"],
      createdAt: userRecord.fields["Created At"],
      updatedAt: userRecord.fields["Updated At"],
      isActive: userRecord.fields["Portal"] === "Active",
      activationKey: userRecord.fields["Activation Key"],
      recordId: userRecord.id
    };

    return {
      success: true,
      data: userData
    };
  } catch (error: any) {
    console.error('Error fetching user from Airtable:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch user data'
    };
  }
}

// Validate portal activation key (portalActivationKey is the Airtable record ID)
export async function validatePortalActivationKey(portalActivationKey: string): Promise<ApiResponse<any>> {
  try {
    logger.debug('Validating portal activation key', { portalActivationKey });

    const response = await airtableFetch(
      `People/${portalActivationKey}`,
      {
        method: 'GET'
      }
    );

    const record = response.data;
    
    if (!record || !record.fields) {
      logger.warn('Record not found or missing fields', { portalActivationKey });
      return {
        success: false,
        error: 'Invalid portal activation key'
      };
    }
    
    // Check if the user is already registered (Portal ID field contains Firebase UID)
    if (record.fields["Portal ID"]) {
      logger.warn('Portal activation key already used - Firebase user exists', { portalActivationKey, existingUid: record.fields["Portal ID"] });
      return {
        success: false,
        error: 'This portal activation key has already been used'
      };
    }

    logger.info('Portal activation key validated successfully', { portalActivationKey });

    return {
      success: true,
      data: {
        firstName: record.fields["First Name"],
        lastName: record.fields["Last Name"],
        email: record.fields["Email"],
        organization: record.fields["Feed Organisation"]
      }
    };
  } catch (error: any) {
    logger.error('Error validating portal activation key', { portalActivationKey, error: error.message });
    return {
      success: false,
      error: error.message || 'Portal activation key validation failed'
    };
  }
}

// Update user with Firebase UID
export async function updateUserWithFirebaseUid(recordId: string, firebaseUid: string): Promise<ApiResponse<any>> {
  try {
    logger.debug('Updating user with Firebase UID', { recordId, firebaseUid });

    const response = await airtableFetch(
      `People/${recordId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          fields: {
            "Portal ID": firebaseUid,
            "Portal": "Active"
          }
        })
      }
    );

    logger.info('User updated successfully in Airtable', { recordId, firebaseUid });

    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    logger.error('Error updating user in Airtable', { recordId, firebaseUid, error: error.message });
    return {
      success: false,
      error: error.message || 'Failed to update user'
    };
  }
} 
