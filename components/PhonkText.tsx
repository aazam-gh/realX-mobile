import React from 'react';
import { Text, TextProps } from 'react-native';
import { Typography } from '../constants/Typography';

/**
 * A Text component that defaults to Phonk font but automatically renders 
 * special symbols (non-alphanumeric characters) using the Poppins font.
 */
export default function PhonkText({ children, style, ...props }: TextProps) {
  const isSymbol = (char: string) => {
    // Match anything that is NOT A-Z, a-z, 0-9 or whitespace
    return /[^A-Za-z0-9\s]/.test(char);
  };

  const renderSymbolicText = (text: string) => {
    // Split by symbols but keep them in the array
    const parts = text.split(/([^A-Za-z0-9\s]+)/g);
    return parts.map((part, index) => {
      if (isSymbol(part)) {
        return (
          <Text key={index} style={{ fontFamily: Typography.poppins.semiBold }}>
            {part}
          </Text>
        );
      }
      return part;
    });
  };

  const processChildren = (child: React.ReactNode): React.ReactNode => {
    if (typeof child === 'string') {
      return renderSymbolicText(child);
    }
    
    if (typeof child === 'number') {
      return renderSymbolicText(child.toString());
    }

    if (React.isValidElement(child)) {
      // For recursive Text components, we want to process their children as well
      // while keeping their existing props/styles
      const element = child as React.ReactElement<any>;
      if (element.type === Text || (element.type as any).displayName === 'Text') {
        const nestedChildren = React.Children.map(element.props.children, processChildren);
        return React.cloneElement(element, {
          children: nestedChildren,
          // We don't force Phonk here because the nested Text might have its own style (e.g. greenText)
        });
      }
      return child;
    }

    if (Array.isArray(child)) {
      return child.map((c, i) => <React.Fragment key={i}>{processChildren(c)}</React.Fragment>);
    }

    return child;
  };

  return (
    <Text
      style={[{ fontFamily: Typography.phonk.bold }, style]}
      {...props}
    >
      {React.Children.map(children, processChildren)}
    </Text>
  );
}
