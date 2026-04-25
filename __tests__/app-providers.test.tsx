import { render, screen } from '@testing-library/react-native';

import { PlaceholderScreen } from '@/components';
import { AppProviders } from '@/providers/AppProviders';

describe('AppProviders', () => {
  it('renders the app shell placeholder content', async () => {
    render(
      <AppProviders>
        <PlaceholderScreen title="Smoke Test" description="Phase 1 app shell" />
      </AppProviders>
    );

    expect(await screen.findByText('Smoke Test')).toBeOnTheScreen();
    expect(await screen.findByText('Phase 1 app shell')).toBeOnTheScreen();
  });
});
