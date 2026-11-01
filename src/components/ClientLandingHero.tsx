import React from 'react';
import { Home } from './Home';
import { ClientNavigationTab } from '../types';
import { SedePintuco } from './ColombiaInteractiveMap';

export interface ClientLandingHeroProps {
  onNavigateTab: (tab: ClientNavigationTab, category?: string) => void;
  onOpenChat: () => void;
  onSelectSede?: (sede: SedePintuco) => void;
}

export const ClientLandingHero: React.FC<ClientLandingHeroProps> = (props) => {
  return <Home {...props} />;
};

export default ClientLandingHero;
