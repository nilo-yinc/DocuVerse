import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const Demo = () => {
    const { id } = useParams();
    const [html, setHtml] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDemo = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/projects/demo/${id}`);
                setHtml(res.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setHtml('<h1>404 Prototype Not Found</h1>');
                setLoading(false);
            }
        };
        fetchDemo();
    }, [id]);

    if (loading) return <div className="text-white text-center mt-20">Loading Prototype...</div>;

    return (
        <iframe
            srcDoc={html}
            style={{ width: '100vw', height: '100vh', border: 'none' }}
            title="Project Demo"
        />
    );
};

export default Demo;
