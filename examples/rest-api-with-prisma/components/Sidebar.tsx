import { FC } from 'react';
import { IconType } from 'react-icons';
import { FaGithub } from 'react-icons/fa';

export interface SidebarItem {
  title: string;
  icon: IconType;
  onClick: () => void;
}

export interface SidebarProps {
  title: string;
  active: number;
  items: SidebarItem[];
}

export const Sidebar: FC<SidebarProps> = ({ title, items, active }) => {
  const sidebarItems = items.map(({ title, icon: IconComponent, onClick }, index) => {
    return (
      <div className={`sidebar-item ${active === index ? 'active' : ''}`} key={index}>
        <button onClick={onClick}>
          <div className="sidebar-item-icon">
            <IconComponent />
          </div>
          <div className="sidebar-item-title">{title}</div>
        </button>
      </div>
    );
  });

  return (
    <div id="sidebar">
      <div className="sidebar-container">
        <div className="sidebar-link">
          <a href="https://github.com/Neo-Ciber94/next-controllers" target="_blank" rel="noreferrer">
            <FaGithub className="github-icon" size={50} />
            <span>{title}</span>
          </a>
        </div>
        {sidebarItems}
      </div>
    </div>
  );
};
