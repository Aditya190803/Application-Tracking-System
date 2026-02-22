import { fireEvent,render, screen } from '@testing-library/react';
import { FileSearch } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { EmptyState } from '@/components/common/EmptyState';

describe('EmptyState', () => {
    it('should render title and description', () => {
        render(
            <EmptyState
                title="No items found"
                description="Try searching for something else"
            />
        );

        expect(screen.getByText('No items found')).toBeInTheDocument();
        expect(screen.getByText('Try searching for something else')).toBeInTheDocument();
    });

    it('should render icon if provided', () => {
        const { container } = render(
            <EmptyState
                title="T"
                description="D"
                icon={FileSearch}
            />
        );

        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should call onAction when button is clicked', () => {
        const onAction = vi.fn();
        render(
            <EmptyState
                title="T"
                description="D"
                actionLabel="Click me"
                onAction={onAction}
            />
        );

        fireEvent.click(screen.getByText('Click me'));
        expect(onAction).toHaveBeenCalledTimes(1);
    });
});
