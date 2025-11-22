
import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#141b29] text-white p-6 text-center" dir="rtl">
          <div className="bg-red-500/10 p-6 rounded-full mb-6 border border-red-500/20 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600 font-['Lalezar']">
            عفواً، حدث خطأ غير متوقع
          </h1>
          <p className="text-gray-400 text-lg mb-2 max-w-md font-medium">
            نواجه مشكلة تقنية في عرض هذه الصفحة.
          </p>
          {this.state.error && (
             <div className="bg-black/30 p-3 rounded border border-white/5 text-xs text-gray-500 font-mono mb-6 max-w-lg overflow-x-auto dir-ltr">
                 {this.state.error.toString()}
             </div>
          )}
          <div className="flex gap-4">
            <button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-[#00A7F8] to-[#00FFB0] text-black font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(0,167,248,0.4)]"
            >
                تحديث الصفحة
            </button>
            <button
                onClick={() => window.location.href = '/'}
                className="bg-white/10 text-white border border-white/20 font-bold py-3 px-8 rounded-full hover:bg-white/20 transition-colors"
            >
                العودة للرئيسية
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

export default ErrorBoundary;
