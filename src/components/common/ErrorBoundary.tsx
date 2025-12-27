import React, { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: undefined });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-stone-50 p-4">
          <div className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h2 className="text-xl font-semibold text-stone-800">
                문제가 발생했습니다
              </h2>
            </div>
            <p className="mb-4 text-sm text-stone-600">
              예상치 못한 오류가 발생했습니다. 새로고침하거나 다시 시도해주세요.
            </p>
            {this.state.error && (
              <details className="mb-4 rounded border border-stone-200 bg-stone-50 p-3">
                <summary className="cursor-pointer text-sm font-medium text-stone-700">
                  오류 상세 정보
                </summary>
                <pre className="mt-2 overflow-auto text-xs text-stone-600">
                  {this.state.error.message}
                  {"\n"}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <div className="flex gap-2">
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="flex-1"
              >
                다시 시도
              </Button>
              <Button
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                새로고침
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
