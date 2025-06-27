'use client';
import React, { createContext, useContext, useRef } from 'react';
import { Toast } from 'primereact/toast';

type NotificationContextType = {
    showToast: (options: any) => void;
    showSuccess: (...args:any[]) => void;
    showInfo: (...args:any[]) => void;
    showError: (...args:any[]) => void;
    showWarning: (...args:any[]) => void;

};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const toastRef = useRef<Toast>(null);

    const showToast = (options: any) => {

        toastRef.current?.show(options);
    };

    const formatOptions  = (args:any[]) => {
        let title = '¡Éxito!';
        let detail = '';
        let life = 3000;
    
        if (args.length === 1) {
            if (typeof args[0] === 'string') {
                detail = args[0];
            } else if (typeof args[0] === 'object') {
                ({ title, detail, life } = args[0]);
            }
        } else if (args.length === 2) {
            title = args[0];
            detail = args[1];
        } else if (args.length >= 3) {

            [title, detail, life] = args;
        }

        return { title, detail, life };
    }
    const showSuccess = (...args: any[]) => {

        let options:any = formatOptions(args);
        options = {...options, severity: 'success' };
        showToast(options);
    }

    const showError = (...args:any[]) => {

        let options:any = formatOptions(args);
        options = {...options, severity: 'error' };
        showToast(options);
    }

     const showInfo = (...args:any[]) => {
    
        let options:any = formatOptions(args);
        options = {...options, severity: 'info' };
        showToast(options);
    }

    const showWarning = (...args:any[]) => {
       let options:any = formatOptions(args);
       options = {...options, severity: 'warn' };
       showToast(options);
    }


    return (
        <NotificationContext.Provider value={{ 
            showToast, 
            showSuccess, 
            showError,
            showInfo,
            showWarning }}>
            <Toast ref={toastRef} />
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotification must be used within NotificationProvider');
    return context;
};