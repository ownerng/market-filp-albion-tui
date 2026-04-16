import React from "react";
import { Box, Text } from "ink";
import { logger } from "../lib/logger.js";

interface Props {
  children: React.ReactNode;
}

interface State {
  err: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  override state: State = { err: null };

  static getDerivedStateFromError(err: Error): State {
    return { err };
  }

  override componentDidCatch(err: Error, info: React.ErrorInfo) {
    logger.error({ err: err.message, stack: err.stack, info: info.componentStack }, "ErrorBoundary");
  }

  override render() {
    if (this.state.err) {
      return (
        <Box flexDirection="column" borderStyle="double" borderColor="red" padding={1}>
          <Text color="red" bold>
            Error inesperado en la TUI
          </Text>
          <Text>{this.state.err.message}</Text>
          <Text dimColor>Detalle en ~/.market-flip/app.log. Pulsá Ctrl+C para salir.</Text>
        </Box>
      );
    }
    return this.props.children;
  }
}
