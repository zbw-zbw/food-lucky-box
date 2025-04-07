import React from 'react';
import { List, Button } from 'antd-mobile';
import styles from './index.module.scss';

const Profile: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.avatar}>
          <img src="/default-avatar.png" alt="avatar" />
        </div>
        <h2>用户名</h2>
      </div>

      <List className={styles.menuList}>
        <List.Item>我的收藏</List.Item>
        <List.Item>历史记录</List.Item>
        <List.Item>设置</List.Item>
      </List>

      <div className={styles.logout}>
        <Button color="danger" block>
          退出登录
        </Button>
      </div>
    </div>
  );
};

export default Profile;
