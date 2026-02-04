import React, { useMemo } from 'react';
import { View, StyleProp, ViewStyle, Dimensions } from 'react-native';
import Svg, { Path, Defs, Pattern, Rect } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TicketEdgeProps {
    position?: 'top' | 'bottom';
    color?: string;
    style?: StyleProp<ViewStyle>;
}

export const FakeBorderPaperOrder = ({
    position = 'top',
    color = 'white',
    style
}: TicketEdgeProps) => {
    const height = 12;
    const patternWidth = 20;
    const holeRadius = 6;

    // Calculate path based on position
    const pathD = useMemo(() => {
        if (position === 'top') {
            // Draw paper below, bite from top
            // M0,12 L0,0 L4,0 A6,6 0 0 0 16,0 L20,0 L20,12 Z
            return `M0,${height} L0,0 L${(patternWidth / 2) - holeRadius},0 A${holeRadius},${holeRadius} 0 0 0 ${(patternWidth / 2) + holeRadius},0 L${patternWidth},0 L${patternWidth},${height} Z`;
        } else {
            // Draw paper above, bite from bottom
            // M0,0 L0,12 L4,12 A6,6 0 0 1 16,12 L20,12 L20,0 Z
            return `M0,0 L0,${height} L${(patternWidth / 2) - holeRadius},${height} A${holeRadius},${holeRadius} 0 0 1 ${(patternWidth / 2) + holeRadius},${height} L${patternWidth},${height} L${patternWidth},0 Z`;
        }
    }, [position]);

    return (
        <View style={[{ height, width: '100%', overflow: 'hidden' }, style]}>
            <Svg height={height} width="100%" preserveAspectRatio="xMinYMin slice">
                <Defs>
                    <Pattern
                        id={`ticket-pattern-${position}`}
                        x="0"
                        y="0"
                        width={patternWidth}
                        height={height}
                        patternUnits="userSpaceOnUse"
                    >
                        <Path d={pathD} fill={color} />
                    </Pattern>
                </Defs>
                <Rect x="0" y="0" width="100%" height={height} fill={`url(#ticket-pattern-${position})`} />
            </Svg>
        </View>
    );
};