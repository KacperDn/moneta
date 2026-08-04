import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("App crashed:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app app--center">
          <div className="app__loading">
            Coś poszło nie tak. Odśwież stronę lub spróbuj później.
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
