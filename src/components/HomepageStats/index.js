import React, {useEffect, useState} from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const StatsList = [
    {
        value: '8年',
        label: '版本沉淀',
        icon: '📦',
    },
    {
        value: '100+',
        label: '资深开发者',
        icon: '🔥',
    },
    {
        value: '50+',
        label: '内置模块',
        icon: '🔧',
    },
    {
        value: '55+',
        label: '社区贡献者',
        icon: '👥',
    },
];

function Counter({end, duration = 2000}) {
    const [count, setCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isVisible) {
                    setIsVisible(true);
                }
            },
            {threshold: 0.1}
        );

        const element = document.getElementById('stats-section');
        if (element) {
            observer.observe(element);
        }

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, [isVisible]);

    useEffect(() => {
        if (!isVisible) return;

        const endNum = typeof end === 'string' ? parseInt(end.replace(/\D/g, '')) : end;
        const increment = endNum / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= endNum) {
                setCount(endNum);
                clearInterval(timer);
            } else {
                setCount(Math.floor(current));
            }
        }, 16);

        return () => clearInterval(timer);
    }, [end, duration, isVisible]);

    const suffix = typeof end === 'string' ? end.replace(/\d/g, '').replace(/\./g, '') : '';
    return <span>{count}{suffix}</span>;
}

function Stat({value, label, icon, index}) {
    return (
        <div className={clsx('col col--3', styles.statCol)}>
            <div
                className={styles.stat}
                style={{
                    '--animation-delay': `${index * 0.1}s`,
                }}
            >
                <div className={styles.statIcon}>
                    <span>{icon}</span>
                </div>
                <div className={styles.statValue}>
                    <Counter end={value}/>
                </div>
                <div className={styles.statLabel}>{label}</div>
            </div>
        </div>
    );
}

export default function HomepageStats() {
    return (
        <section className={styles.stats} id="stats-section">
            <div className="container">
                <div className="row">
                    {StatsList.map((props, idx) => (
                        <Stat key={idx} {...props} index={idx}/>
                    ))}
                </div>
            </div>
        </section>
    );
}
