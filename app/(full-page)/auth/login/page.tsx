/* eslint-disable @next/next/no-img-element */
'use client';
import { useRouter } from 'next/navigation';
import React, { useContext, useState, useEffect } from 'react';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { useAuth } from '@/layout/context/authContext';
import { useNotification } from '@/layout/context/notificationContext';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';

const LoginPage = () => {
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [checked, setChecked] = useState(false);
    const { layoutConfig } = useContext(LayoutContext);
    const { login, loading, isAuthenticated } = useAuth();
    const { showSuccess, showError } = useNotification();
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});


    const router = useRouter();
    const containerClassName = classNames('surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden', { 'p-input-filled': layoutConfig.inputStyle === 'filled' });

    const validate = () => {
        const newErrors: { email?: string; password?: string } = {};
        if (!email) {
            newErrors.email = 'El correo es obligatorio';
        } /*else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'El correo no es válido';
        }*/
        
        if (!password) {
            newErrors.password = 'La contraseña es obligatoria';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
       
        if (!validate()) return;
        try {
            await login(email, password);
            showSuccess('¡Éxito!', 'Has iniciado sesión correctamente.');
            router.push('/');
            
        } catch (error) {
        
            showError('¡Error!', 'No se pudo iniciar sesión. Por favor, verifica tus credenciales e intenta nuevamente.');
        }
    };

    useEffect(() => {
        if (!loading && isAuthenticated) {
            router.replace('/');
        }
    }, [loading, isAuthenticated, router]);

    return (
        <div className={containerClassName}>
            <div className="flex flex-column align-items-center justify-content-center">
                {/*<img src={`/layout/images/logo-${layoutConfig.colorScheme === 'light' ? 'dark' : 'white'}.svg`} alt="Sakai logo" className="mb-5 w-6rem flex-shrink-0" />*/}
                <div
                    style={{
                        borderRadius: '56px',
                        padding: '0.3rem',
                        background: 'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)'
                    }}
                >
                    <div className="w-full  surface-card py-8 px-5 sm:px-8" style={{ borderRadius: '53px' }}>
                        <div className="text-center mb-5">
                            <i className='pi pi-user text-8xl'></i>
                            <div className="text-900 text-3xl font-medium mb-3">Bienvenido!</div>
                            <span className="text-600 font-medium">Inicia sesión para continuar</span>
                        </div>

                        <div>
                            <div className="flex flex-column mb-5">
                                <label htmlFor="email1" className="text-900 text-xl font-medium mb-2">
                                    Usuario <span className='text-red-600'>*</span>
                                </label>
                                <InputText id="email1" type="text" 
                                placeholder="Nombre de usuario" 
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full md:w-30rem mb-2" 
                                style={{ padding: '1rem' }} />
                                {errors.email && <span className='text-red-600'>{errors.email}</span>}
                            </div>
                            <div className='flex flex-column'>
                                <label htmlFor="password1" className="block text-900 font-medium text-xl mb-2">
                                    Contraseña  <span className='text-red-600'>*</span>
                                </label>
                                <Password inputId="password1" 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    placeholder="Contraseña" 
                                    className="w-full mb-2" 
                                    inputClassName="w-full p-3 md:w-30rem">
                                </Password>
                                 {errors.password && <span className='text-red-600'>{errors.password}</span>}
                            </div>
                            

                            <div className="flex align-items-center justify-content-between mb-5 gap-5">
                               {/* <div className="flex align-items-center">
                                    <Checkbox inputId="rememberme1" checked={checked} onChange={(e) => setChecked(e.checked ?? false)} className="mr-2"></Checkbox>
                                    <label htmlFor="rememberme1">Recordar</label>
                                </div>
                                <a className="font-medium no-underline ml-2 text-right cursor-pointer" style={{ color: 'var(--primary-color)' }}>
                                    Recuperar contraseña
                                </a>
                                */}
                            </div>
                            
                            <Button
                                loading={loading}
                                disabled={loading} 
                                label="Iniciar sesión" 
                                className="w-full p-3 text-xl" 
                                onClick={handleLogin}></Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
