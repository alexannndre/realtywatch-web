import { useInputState } from "@mantine/hooks";
import { useSession } from "next-auth/react";
import { type UseFormResetField, type Control } from "react-hook-form";
import { useAdms, useAdms2, useAdms3 } from "~/hooks/useQueries";
import { type AdministrativeDivision, type SelectOption } from "~/types";
import { type FormSchemaType } from "./AddPropertyDrawer";
import { NumberInput, Select, TextInput } from "react-hook-form-mantine";
import { Group, Loader } from "@mantine/core";
import { IconTag, IconWorldLatitude, IconWorldLongitude } from "@tabler/icons-react";

type AddPropertyAddressProps = {
  control: Control<FormSchemaType>;
  resetField: UseFormResetField<FormSchemaType>;
};

export function AddPropertyAddress({ control, resetField }: AddPropertyAddressProps) {
  const { data: session, status } = useSession();

  const [selectedAdm1, setSelectedAdm1] = useInputState("");
  const [selectedAdm2, setSelectedAdm2] = useInputState("");

  const { data: adm1Data, isLoading: adm1IsLoading } = useAdms({ session, status });

  const { data: adm2Data, isLoading: adm2IsLoading } = useAdms2({
    session,
    status,
    parentId: selectedAdm1 ? selectedAdm1 : "1",
  });

  const { data: adm3Data, isLoading: adm3IsLoading } = useAdms3({
    session,
    status,
    parentId: selectedAdm2 ? selectedAdm2 : "2",
  });

  let adm1 = [] as SelectOption[];
  let adm2 = [] as SelectOption[];
  let adm3 = [] as SelectOption[];

  const formatAdmData = (data: AdministrativeDivision[]) => {
    return data.map((adm) => ({
      value: adm.id.toString(),
      label: adm.name,
    }));
  };

  if (adm1Data) adm1 = formatAdmData(adm1Data);
  if (adm2Data) adm2 = formatAdmData(adm2Data);
  if (adm3Data) adm3 = formatAdmData(adm3Data);

  // TODO: withAsterisk doesn't match reality, required_without_all:Full Address,Adm 1 Id
  return (
    <div>
      <TextInput
        className="mb-3"
        name="Full Address"
        label="Address"
        placeholder="123, Ai Hoshino Street"
        control={control}
        withAsterisk
      />
      <Group className="mb-3" position="apart" grow>
        <Select
          data={adm1}
          name="Adm1"
          label="Distrito"
          placeholder="Distrito"
          icon={adm1IsLoading && <Loader size="1rem" />}
          control={control}
          searchable
          clearable
          nothingFound="No options"
          onChange={(value) => {
            setSelectedAdm1(value);
            setSelectedAdm2(null); // required so Adm3 is disabled
            resetField("Adm2", { defaultValue: "" });
            resetField("Adm3", { defaultValue: "" });
          }}
        />
        <Select
          data={adm2}
          name="Adm2"
          label="Concelho"
          placeholder="Concelho"
          icon={adm2IsLoading && <Loader size="1rem" />}
          control={control}
          searchable
          clearable
          nothingFound="No options"
          onChange={(value) => {
            setSelectedAdm2(value);
            resetField("Adm3", { defaultValue: "" });
          }}
          disabled={!selectedAdm1}
        />
        <Select
          data={adm3}
          name="Adm3"
          label="Freguesia"
          placeholder="Freguesia"
          icon={adm3IsLoading && <Loader size="1rem" />}
          control={control}
          searchable
          clearable
          nothingFound="No options"
          disabled={!selectedAdm2}
        />
      </Group>

      <Group className="mb-3" position="apart" grow>
        <TextInput
          name="Postal Code"
          label="Postal Code"
          placeholder="Postal Code"
          control={control}
          icon={<IconTag size="1rem" />}
        />
        <NumberInput
          name="Latitude"
          label="Latitude"
          placeholder="Latitude"
          precision={6}
          hideControls
          decimalSeparator=","
          control={control}
          icon={<IconWorldLatitude size="1rem" />}
          min={-90}
          max={90}
        />
        <NumberInput
          name="Longitude"
          label="Longitude"
          placeholder="Longitude"
          precision={6}
          hideControls
          decimalSeparator=","
          control={control}
          icon={<IconWorldLongitude size="1rem" />}
          min={-180}
          max={180}
        />
      </Group>
      {/* TODO: Map & get address from point */}
    </div>
  );
}