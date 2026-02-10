import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Layers, GitMerge, Database, Globe, Lock, X, ChevronRight, CheckCircle } from 'lucide-react';
import { CardContainer, CardBody, CardItem, CardSpotlight } from '../ui/Card3D';

const LearningFeature = () => {
    const [showCurriculum, setShowCurriculum] = useState(false);

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
        <section className="py-24 bg-transparent relative z-10">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1f2937] border border-[#30363d] text-[#c9d1d9] text-xs font-medium mb-4"
                    >
                        <BookOpen size={14} className="text-[#f2cc60]" />
                        <span>Student Learning Center</span>
                    </motion.div>
                    <h2 className="text-4xl font-bold text-white mb-4">Master the Fundamentals</h2>
                    <p className="text-[#8b949e] max-w-2xl mx-auto">
                        AutoSRS isn't just a tool; it's a mentor. Explore our interactive guides on modern software architecture.
                    </p>
                </div>

                {/* Concept Carousel - Spotlight Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    {concepts.map((item, index) => (
                        <CardContainer key={index} containerClassName="py-0 h-full" className="h-full">
                            <CardBody className="h-full w-full">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="h-full"
                                >
                                    <CardSpotlight className="h-full cursor-pointer group" radius={200}>
                                        <CardItem translateZ="50" className="w-full">
                                            <div className={`w-12 h-12 rounded-lg ${item.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative z-20`}>
                                                <item.icon className={item.color} size={24} />
                                            </div>
                                        </CardItem>
                                        <CardItem translateZ="60" className="w-full">
                                            <h3 className="text-white font-bold mb-2 group-hover:text-[#f2cc60] transition-colors relative z-20">{item.title}</h3>
                                        </CardItem>
                                        <CardItem translateZ="40" className="w-full">
                                            <p className="text-sm text-[#8b949e] leading-relaxed line-clamp-3 relative z-20">
                                                {item.desc}
                                            </p>
                                        </CardItem>
                                    </CardSpotlight>
                                </motion.div>
                            </CardBody>
                        </CardContainer>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <button
                        onClick={() => setShowCurriculum(true)}
                        className="text-[#f2cc60] hover:text-white hover:underline text-sm font-semibold transition flex items-center justify-center gap-2 mx-auto"
                    >
                        View Full Curriculum
                        <span className="text-xl">→</span>
                    </button>
                </div>
            </div>

            {/* Full Curriculum Modal */}
            <AnimatePresence>
                {showCurriculum && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowCurriculum(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", damping: 25 }}
                            className="bg-[#161b22] border border-[#30363d] rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-6 border-b border-[#30363d]">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Full Curriculum</h2>
                                    <p className="text-sm text-[#8b949e] mt-1">Master modern software architecture fundamentals</p>
                                </div>
                                <button
                                    onClick={() => setShowCurriculum(false)}
                                    className="p-2 rounded-lg hover:bg-[#21262d] transition text-[#8b949e] hover:text-white"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 overflow-y-auto max-h-[calc(85vh-100px)]">
                                <div className="space-y-6">
                                    {concepts.map((item, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="bg-[#0d1117] border border-[#30363d] rounded-xl p-6 hover:border-[#f2cc60]/50 transition-colors"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`w-12 h-12 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>
                                                    <item.icon className={item.color} size={24} />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                                                    <p className="text-[#8b949e] mb-4">{item.fullDesc}</p>

                                                    <div className="space-y-2">
                                                        <h4 className="text-sm font-semibold text-[#f2cc60] uppercase tracking-wider mb-3">Topics Covered</h4>
                                                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                            {item.topics.map((topic, topicIndex) => (
                                                                <li key={topicIndex} className="flex items-center gap-2 text-sm text-[#c9d1d9]">
                                                                    <CheckCircle size={14} className="text-[#238636] flex-shrink-0" />
                                                                    {topic}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Footer CTA */}
                                <div className="mt-8 p-6 bg-gradient-to-r from-[#f2cc60]/10 to-[#79c0ff]/10 border border-[#30363d] rounded-xl text-center">
                                    <h3 className="text-lg font-bold text-white mb-2">Ready to Start Learning?</h3>
                                    <p className="text-sm text-[#8b949e] mb-4">Generate your first SRS document and see these concepts in action.</p>
                                    <button
                                        onClick={() => {
                                            setShowCurriculum(false);
                                            window.location.href = '/enterprise/form';
                                        }}
                                        className="bg-[#f2cc60] text-black font-bold px-6 py-3 rounded-lg hover:bg-[#e5bf53] transition inline-flex items-center gap-2"
                                    >
                                        Get Started <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};

export default LearningFeature;
