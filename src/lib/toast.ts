import toast from 'react-hot-toast';

export const showToast = {
    success: (message: string) => {
        toast.success(message, {
            duration: 3000,
            position: 'bottom-center',
            style: {
                background: '#18181b',
                color: '#fff',
                border: '1px solid #27272a',
            },
        });
    },

    error: (message: string) => {
        toast.error(message, {
            duration: 4000,
            position: 'bottom-center',
            style: {
                background: '#18181b',
                color: '#fff',
                border: '1px solid #27272a',
            },
        });
    },

    loading: (message: string) => {
        return toast.loading(message, {
            position: 'bottom-center',
            style: {
                background: '#18181b',
                color: '#fff',
                border: '1px solid #27272a',
            },
        });
    },

    dismiss: (toastId: string) => {
        toast.dismiss(toastId);
    },

    promise: <T,>(
        promise: Promise<T>,
        messages: {
            loading: string;
            success: string;
            error: string;
        }
    ) => {
        return toast.promise(
            promise,
            {
                loading: messages.loading,
                success: messages.success,
                error: messages.error,
            },
            {
                position: 'bottom-center',
                style: {
                    background: '#18181b',
                    color: '#fff',
                    border: '1px solid #27272a',
                },
            }
        );
    },
};
