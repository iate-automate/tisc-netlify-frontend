// ARTE feature-specific types

export interface ArteBehaviour {
  Name: string;
  Type: string;
  Purpose: string[];
  Provision: string[];
  "Record ID": string;
}

export interface ArteSystem {
  Name: string;
  "Image URL": string;
  "Record ID": string;
  Behaviours: string[];
}

export interface ArtePurpose {
  Name: string;
  Systems: string[];
  Behaviours: string[];
  "Record ID": string;
}

export interface ArteProvision {
  Excerpt: string;
  Description: string;
  Purpose: string[];
  Systems: string[];
  "Record ID": string;
}


