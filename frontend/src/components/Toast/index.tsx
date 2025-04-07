import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import styles from './index.module.scss';

interface ToastProps {
  content: string;
  duration?: number;
  onClose?: () => void;
}

interface ToastOptions {
  content: string;
  duration?: number;
}

const ToastComponent: React.FC<ToastProps> = ({ content, duration = 2000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={styles.toastOverlay}>
      <div className={styles.toastContent}>{content}</div>
    </div>
  );
};

let toastContainer: HTMLDivElement | null = null;
let root: ReturnType<typeof createRoot> | null = null;

const show = (options: ToastOptions) => {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = styles.toastContainer;
    document.body.appendChild(toastContainer);
    root = createRoot(toastContainer);
  }

  const props: ToastProps = {
    ...options,
    onClose: () => {
      if (root && toastContainer) {
        root.unmount();
        document.body.removeChild(toastContainer);
        toastContainer = null;
        root = null;
      }
    },
  };

  root?.render(<ToastComponent {...props} />);
};

export const Toast = {
  show,
};
