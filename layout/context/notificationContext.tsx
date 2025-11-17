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
        let summary = '';
        let detail = '';
        let life = 3000;
    
        if (args.length === 1) {
            if (typeof args[0] === 'string') {
                detail = args[0];
            } else if (typeof args[0] === 'object') {
                ({ summary, detail, life } = args[0]);
            }
        } else if (args.length === 2) {
            summary = args[0];
            detail = args[1];
        } else if (args.length >= 3) {

            [summary, detail, life] = args;
        }

        return { summary, detail, life };
    }
    const showSuccess = (...args: any[]) => {
        let options: any = formatOptions(args);
        options = {
            ...options,
            summary: args.length == 1 ? '¡Éxito!' : options.summary,
            severity: 'success',
            life: options.life || 3000
        };
        showToast(options);
    };

    const showError = (...args:any[]) => {

        let options:any = formatOptions(args);
        options = {
            ...options,
            summary: args.length == 1 ? '¡Error!' : options.summary,
            severity: 'error',
            life: options.life || 5000
        };
        showToast(options);
    }

     const showInfo = (...args:any[]) => {
    
        let options:any = formatOptions(args);
                options = {
                    ...options,
                    summary: args.length == 1 ? '¡Info!' : options.summary,
                    severity: 'info',
                    life: options.life || 3000
                };
        showToast(options);
    }

    const showWarning = (...args:any[]) => {
       let options:any = formatOptions(args);
       options = {
        ...options,
        summary: args.length == 1 ? '¡Advertencia!' : options.summary,
        severity: 'warn',
        life: options.life || 4000
       };
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