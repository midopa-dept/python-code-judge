import React from 'react';
import { Card } from '../Common';

const AdminPanelCard = ({ title, description, actions, children }) => {
  return (
    <Card className="w-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </Card>
  );
};

export default AdminPanelCard;
