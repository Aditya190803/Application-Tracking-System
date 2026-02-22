import { render, screen } from '@testing-library/react';
import { Activity } from 'lucide-react';
import { describe, expect,it } from 'vitest';

import { StatCard } from '@/components/common/StatCard';

describe('StatCard', () => {
    it('should render label and value', () => {
        render(<StatCard icon={Activity} label="Test Label" value="100" />);

        expect(screen.getByText('Test Label')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should render trend when provided', () => {
        render(
            <StatCard
                icon={Activity}
                label="Test"
                value="50"
                trend={{ value: 10, isPositive: true }}
            />
        );

        expect(screen.getByText('10%')).toBeInTheDocument();
        expect(screen.getByText('↑')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
        const { container } = render(
            <StatCard icon={Activity} label="Test" value="0" className="custom-class" />
        );

        expect(container.firstChild).toHaveClass('custom-class');
    });
});
