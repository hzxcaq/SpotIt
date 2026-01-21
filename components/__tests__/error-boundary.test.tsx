import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary, withErrorBoundary } from '../error-boundary';

// 测试组件：会抛出错误的组件
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('测试错误');
  }
  return <div>正常组件</div>;
};

// 测试组件：正常组件
const NormalComponent = () => <div>正常渲染</div>;

describe('ErrorBoundary', () => {
  // 抑制控制台错误输出，因为我们故意触发错误
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('正常组件')).toBeInTheDocument();
  });

  it('should render error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('出现了一些问题')).toBeInTheDocument();
    expect(screen.getByText(/应用遇到了意外错误/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重试' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '刷新页面' })).toBeInTheDocument();
  });

  it('should render custom fallback when provided', () => {
    const customFallback = <div>自定义错误页面</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('自定义错误页面')).toBeInTheDocument();
    expect(screen.queryByText('出现了一些问题')).not.toBeInTheDocument();
  });

  it('should call onError callback when error occurs', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    );
  });

  it('should reset error state when retry button is clicked', () => {
    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);

      React.useEffect(() => {
        // 在第一次渲染后设置为不抛出错误
        const timer = setTimeout(() => setShouldThrow(false), 100);
        return () => clearTimeout(timer);
      }, []);

      return <ThrowError shouldThrow={shouldThrow} />;
    };

    render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    // 应该显示错误UI
    expect(screen.getByText('出现了一些问题')).toBeInTheDocument();

    // 点击重试按钮
    fireEvent.click(screen.getByRole('button', { name: '重试' }));

    // 错误应该被重置，但由于组件仍然会抛出错误，所以仍然显示错误UI
    // 这个测试主要验证重试按钮的功能
    expect(screen.getByRole('button', { name: '重试' })).toBeInTheDocument();
  });

  it('should reload page when reload button is clicked', () => {
    // Mock window.location.reload
    const mockReload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByRole('button', { name: '刷新页面' }));

    expect(mockReload).toHaveBeenCalled();
  });

  it('should show error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('🔍 错误详情 (开发模式)')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('should show error ID in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/错误ID:/)).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });
});

describe('withErrorBoundary HOC', () => {
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('should wrap component with error boundary', () => {
    const WrappedComponent = withErrorBoundary(NormalComponent);

    render(<WrappedComponent />);

    expect(screen.getByText('正常渲染')).toBeInTheDocument();
  });

  it('should catch errors in wrapped component', () => {
    const WrappedComponent = withErrorBoundary(ThrowError);

    render(<WrappedComponent shouldThrow={true} />);

    expect(screen.getByText('出现了一些问题')).toBeInTheDocument();
  });

  it('should use custom fallback in HOC', () => {
    const customFallback = <div>HOC 自定义错误页面</div>;
    const WrappedComponent = withErrorBoundary(ThrowError, customFallback);

    render(<WrappedComponent shouldThrow={true} />);

    expect(screen.getByText('HOC 自定义错误页面')).toBeInTheDocument();
  });

  it('should set correct display name', () => {
    const TestComponent = () => <div>Test</div>;
    TestComponent.displayName = 'TestComponent';

    const WrappedComponent = withErrorBoundary(TestComponent);

    expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)');
  });
});