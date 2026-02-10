import { motion } from 'framer-motion';
import { BookOpen, Layers, GitMerge, Database, Globe, Lock, ArrowLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CardContainer, CardBody, CardItem, CardSpotlight } from '../components/ui/Card3D';
import CLIHeader from '../components/layout/CLIHeader';
import SystemStatusFooter from '../components/layout/SystemStatusFooter';

const CurriculumPage = () => {
    const concepts = [
        {
            title: "Microservices",
            icon: Layers,
            color: "text-[#79c0ff]",
            bg: "bg-[#79c0ff]/10",
            desc: "Learn how to decompose applications into loosely coupled services.",
            fullDesc: "Master the art of building scalable distributed systems using microservices architecture.",
            topics: [
                "Service decomposition strategies",
                "Inter-service communication (REST, gRPC, Message Queues)",
                "Service discovery and load balancing",
                "Data consistency patterns (Saga, Event Sourcing)",
                "Containerization with Docker & Kubernetes"
            ]
        },
        {
            title: "API Design",
            icon: Globe,
            color: "text-[#f2cc60]",
            bg: "bg-[#f2cc60]/10",
            desc: "REST vs GraphQL? Learn strict contracts and idempotent operations.",
            fullDesc: "Design robust, scalable APIs that developers love to use.",
            topics: [
                "RESTful API principles and best practices",
                "GraphQL schema design and resolvers",
                "API versioning strategies",
                "Rate limiting and throttling",
                "OpenAPI/Swagger documentation"
            ]
        },
        {
            title: "Database Schema",
            icon: Database,
            color: "text-[#ff7b72]",
            bg: "bg-[#ff7b72]/10",
            desc: "Normalization, indexing strategies, and NoSQL patterns.",
            fullDesc: "Design efficient database schemas for performance and scalability.",
            topics: [
                "Normalization forms (1NF to BCNF)",
                "Index optimization and query planning",
                "NoSQL data modeling (MongoDB, Redis)",
                "Database sharding and replication",
                "ACID vs BASE consistency models"
            ]
        },
        {
            title: "CI/CD Pipelines",
            icon: GitMerge,
            color: "text-[#d2a8ff]",
            bg: "bg-[#d2a8ff]/10",
            desc: "Automate testing and deployment for reliable releases.",
            fullDesc: "Build automated pipelines for continuous integration and deployment.",
            topics: [
                "GitHub Actions and GitLab CI",
                "Automated testing strategies",
                "Blue-green and canary deployments",
                "Infrastructure as Code (Terraform)",
                "Monitoring and rollback strategies"
            ]
        },
        {
            title: "Auth Patterns",
            icon: Lock,
            color: "text-[#56d364]",
            bg: "bg-[#56d364]/10",
            desc: "OAuth2, OIDC, and JWT best practices explained securely.",
            fullDesc: "Implement secure authentication and authorization patterns.",
            topics: [
                "OAuth 2.0 flows (Authorization Code, Client Credentials)",
                "OpenID Connect (OIDC) integration",
                "JWT best practices and security",
                "Role-based access control (RBAC)",
                "Multi-factor authentication (MFA)"
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-[#0d1117] flex flex-col">
            <CLIHeader />

            <main className="flex-1 py-20 px-6 relative overflow-hidden">
                {/* Decorative Gradients */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#f2cc60]/5 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#79c0ff]/5 blur-[120px] rounded-full pointer-events-none"></div>

                <div className="max-w-5xl mx-auto relative z-10">
                    {/* Header */}
                    <div className="mb-12">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 text-[#8b949e] hover:text-white transition-colors mb-8 group"
                        >
                            <ArrowLeft size={18} className="group-hover:-translateX-1 transition-transform" />
                            Back to Home
                        </Link>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1f2937] border border-[#30363d] text-[#f2cc60] text-xs font-medium">
                                <BookOpen size={14} />
                                <span>Complete Learning Path</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-white">Full Software <span className="text-[#f2cc60]">Curriculum</span></h1>
                            <p className="text-[#8b949e] text-lg max-w-2xl">
                                Master modern software architecture fundamentals with our structured curriculum, designed to take you from a developer to a system architect.
                            </p>
                        </motion.div>
                    </div>

                    {/* Curriculum List */}
                    <div className="space-y-8">
                        {concepts.map((item, index) => (
                            <CardContainer key={index} containerClassName="py-0" className="w-full">
                                <CardBody className="w-full">
                                    <CardItem translateZ="40" className="w-full">
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: index * 0.1 }}
                                            className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 hover:border-[#f2cc60]/50 transition-colors group"
                                        >
                                            <div className="flex flex-col md:flex-row items-start gap-8">
                                                <CardItem translateZ="60" className="flex-shrink-0">
                                                    <div className={`w-16 h-16 rounded-2xl ${item.bg} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                                                        <item.icon className={item.color} size={32} />
                                                    </div>
                                                </CardItem>

                                                <div className="flex-1">
                                                    <CardItem translateZ="50">
                                                        <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-[#f2cc60] transition-colors">{item.title}</h3>
                                                    </CardItem>
                                                    <CardItem translateZ="30">
                                                        <p className="text-[#8b949e] text-lg mb-6 leading-relaxed">{item.fullDesc}</p>
                                                    </CardItem>

                                                    <div className="space-y-4">
                                                        <h4 className="text-sm font-bold text-[#f2cc60] uppercase tracking-widest mb-4">Modules & Topics</h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {item.topics.map((topic, topicIndex) => (
                                                                <CardItem key={topicIndex} translateZ={20 + (topicIndex * 5)} className="w-full">
                                                                    <div className="flex items-center gap-3 text-[#c9d1d9] bg-[#0d1117] p-3 rounded-lg border border-[#30363d]/50 hover:border-[#f2cc60]/30 transition-colors">
                                                                        <CheckCircle size={16} className="text-[#238636] flex-shrink-0" />
                                                                        <span className="text-sm">{topic}</span>
                                                                    </div>
                                                                </CardItem>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </CardItem>
                                </CardBody>
                            </CardContainer>
                        ))}
                    </div>

                    {/* Final CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mt-20 p-12 bg-gradient-to-br from-[#161b22] to-[#0d1117] border border-[#30363d] rounded-3xl text-center relative overflow-hidden group shadow-2xl"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#f2cc60]/5 to-[#79c0ff]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative z-10">
                            <h2 className="text-3xl font-bold text-white mb-4">Ready to Architect Your Future?</h2>
                            <p className="text-[#8b949e] text-lg mb-8 max-w-xl mx-auto">
                                Apply these architectural patterns to your own projects with our AI-powered SRS generation engine.
                            </p>
                            <Link
                                to="/enterprise/form"
                                className="inline-flex items-center gap-3 bg-[#f2cc60] text-black font-bold px-10 py-4 rounded-xl hover:bg-[#e5bf53] transition-all hover:scale-105 shadow-xl shadow-[#f2cc60]/10"
                            >
                                Get Started Now <ChevronRight size={20} />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </main>

            <SystemStatusFooter />
        </div>
    );
};

export default CurriculumPage;
