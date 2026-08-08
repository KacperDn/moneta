import { Component, ReactNode } from "react";
import i18n from "./i18n";

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
            {i18n.t("errorBoundary.message")}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
