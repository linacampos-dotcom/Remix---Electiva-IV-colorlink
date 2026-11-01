import React from 'react';
import { Catalog, CatalogProps } from './Catalog';

export type CatalogSectionProps = CatalogProps;

export const CatalogSection: React.FC<CatalogSectionProps> = (props) => {
  return <Catalog {...props} />;
};

export default CatalogSection;
