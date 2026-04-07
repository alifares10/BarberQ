import { render, screen } from '@testing-library/react-native';

import { PlaceholderScreen } from '@/components';
import { AppProviders } from '@/providers/AppProviders';

describe('AppProviders', () => {
  it('renders the app shell placeholder content', () => {
    render(
      <AppProviders>
        <PlaceholderScreen title="Smoke Test" description="Phase 1 app shell" />
      </AppProviders>
    );

    expect(screen.getByText('Smoke Test')).toBeOnTheScreen();
    expect(screen.getByText('Phase 1 app shell')).toBeOnTheScreen();
  });
});
