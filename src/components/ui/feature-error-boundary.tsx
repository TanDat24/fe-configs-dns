"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  featureName: string;
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class FeatureErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[${this.props.featureName}]`, error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-800">
          <p className="font-semibold">Khong tai duoc {this.props.featureName}.</p>
          <p className="mt-2 text-red-700">Vui long tai lai trang hoac thu lai sau.</p>
          <button
            type="button"
            className="mt-4 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            onClick={() => this.setState({ hasError: false })}
          >
            Thu lai
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
