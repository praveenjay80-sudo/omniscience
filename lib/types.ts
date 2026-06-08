export interface L3Item {
  name: string;
}

export interface L2Item {
  name: string;
  l3: L3Item[];
}

export interface L1Item {
  name: string;
  l2: L2Item[];
}

export interface Domain {
  name: string;
  l1: L1Item[];
}

export interface Taxonomy {
  domains: Domain[];
  generatedAt: string;
}
