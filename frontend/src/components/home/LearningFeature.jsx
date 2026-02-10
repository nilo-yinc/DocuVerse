import { motion } from 'framer-motion';
import { BookOpen, Layers, GitMerge, Database, Globe, Lock, ChevronRight, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CardContainer, CardBody, CardItem, CardSpotlight } from '../ui/Card3D';

const LearningFeature = () => {

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
                    <Link
                        to="/curriculum"
                        className="text-[#f2cc60] hover:text-white hover:underline text-sm font-semibold transition flex items-center justify-center gap-2 mx-auto"
                    >
                        View Full Curriculum
                        <span className="text-xl">→</span>
                    </Link>
                </div>
            </div>

        </section>
    );
};

export default LearningFeature;
