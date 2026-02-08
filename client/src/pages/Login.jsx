import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await login(email, password);
        if (res.success) {
            navigate('/');
        } else {
            alert(res.msg);
        }
    };

    return (
        <div className="flex justify-center items-center h-screen bg-dark-bg">
            <form onSubmit={handleSubmit} className="bg-dark-card p-8 rounded border border-neon-purple shadow-lg w-96">
                <h2 className="text-2xl mb-6 text-neon-blue font-bold text-center">DocuVerse Login</h2>
                <div className="mb-4">
                    <label className="block mb-2">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-2 bg-dark-input rounded text-white border border-gray-700 focus:border-neon-blue outline-none"
                    />
                </div>
                <div className="mb-6">
                    <label className="block mb-2">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 bg-dark-input rounded text-white border border-gray-700 focus:border-neon-blue outline-none"
                    />
                </div>
                <button type="submit" className="w-full bg-neon-purple text-white p-2 rounded hover:bg-purple-700 transition">
                    Enter System
                </button>
            </form>
        </div>
    );
};

export default Login;
