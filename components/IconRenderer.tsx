
import React from 'react';
import * as LucideIcons from 'lucide-react';

interface IconRendererProps {
  name: string;
  size?: number;
  className?: string;
}

const IconRenderer: React.FC<IconRendererProps> = ({ name, size = 48, className = "" }) => {
  // Try to find the icon in the Lucide library
  // Normalize the name (Gemini might return mixed cases)
  const normalizedName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  const IconComponent = (LucideIcons as any)[normalizedName] || LucideIcons.Sparkles;

  return <IconComponent size={size} className={className} />;
};

export default IconRenderer;
