
export interface BaseInputProps {
    id: string;
    value: any;
    onChange: (value: any, valid?: boolean) => void;
    onClick?: () => void; 
    disabled: boolean;
}
