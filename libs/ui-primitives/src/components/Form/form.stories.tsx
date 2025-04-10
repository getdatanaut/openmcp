import type { Meta } from '@storybook/react';

import { FormContext, useFormStore } from './form.context.ts';
// import { SelectItem } from '../Select/select-item.tsx';
import {
  Form,
  FormButton,
  FormField,
  FormInput,
  type FormProps,
  FormReset,
  // FormSelect,
} from './form.tsx';

const meta = {
  title: 'Components / Forms',
  component: Form,
} satisfies Meta<typeof Form>;

export default meta;

const BasicForm = (props: FormProps) => {
  const form = useFormStore({ defaultValues: { name: 'John Doe', email: '' } });
  const $ = form.names;

  form.useSubmit(async state => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(JSON.stringify(state.values, null, 4));
  });

  return (
    <Form store={form} className="w-80" {...props}>
      <FormField name={$.name} label="Name">
        <FormInput name={$.name} required placeholder="John Doe" />
      </FormField>

      <FormField name={$.email} label="Email" hint="Please use your work email address.">
        <FormInput name={$.email} required type="email" placeholder="you@your-company.com" />
      </FormField>

      <div className="flex gap-2">
        <FormButton validProps={{ intent: 'primary' }} type="submit">
          Sign Up
        </FormButton>

        <FormReset>Reset</FormReset>
      </div>
    </Form>
  );
};

export const Basic = (props: FormProps) => {
  return <BasicForm {...props} />;
};

export const Disabled = (props: FormProps) => {
  return <BasicForm disabled {...props} />;
};

export const Readonly = (props: FormProps) => {
  return <BasicForm readOnly {...props} />;
};

/**
 * For example, could disable all forms in a section of the app if the user does not have write permission, etc.
 */
export const DisabledViaContext = (props: FormProps) => {
  return (
    <FormContext.Provider value={{ disabled: true }}>
      <div className="flex flex-col gap-10 divide-y">
        <BasicForm {...props} />
        <BasicForm {...props} />
      </div>
    </FormContext.Provider>
  );
};

// export const WithSelect = (props: FormProps) => {
//   const form = useFormStore({ defaultValues: { email: '', role: '' } });
//   const $ = form.names;

//   form.useSubmit(async state => {
//     alert(JSON.stringify(state.values, null, 4));
//   });

//   return (
//     <Form store={form} className="w-96" {...props}>
//       <HStack spacing={4}>
//         <div className="flex-1">
//           <FormField name={$.email} label="Email">
//             <FormInput name={$.email} required placeholder="your-teammate@acme.com" />
//           </FormField>
//         </div>

//         <div className="w-36">
//           <FormField name={$.role} label="Role">
//             <FormSelect
//               name={$.role}
//               required
//               placeholder="Pick a Role"
//               render={<Button fullWidth className="justify-between" endIcon={faChevronDown} />}
//             >
//               <SelectItem value="admin">Admin</SelectItem>
//               <SelectItem value="member">Member</SelectItem>
//               <SelectItem value="guest">Guest</SelectItem>
//             </FormSelect>
//           </FormField>
//         </div>
//       </HStack>

//       <Button type="submit">Invite</Button>
//     </Form>
//   );
// };
