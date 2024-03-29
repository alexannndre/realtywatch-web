import { createStyles } from "@mantine/core";
import { IconStarFilled } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { priceToString, priceToStringShort } from "~/lib/propertyHelper";

export type LineChartPayload = {
  name: string;
  "Average Sale Price": number | null;
  "Average Rent Price": number | null;
  "Average Rating": number | null;
};

export const formatRatingTooltip = (value: number) => {
  return (value / 2).toFixed(2).replaceAll(".", ",").replaceAll(",00", "");
};

const RWLineChart = ({
  data,
  firstPriceKey,
  firstPriceColor,
  secondPriceKey,
  secondPriceColor,
  isFirstActive = true,
}: {
  data: LineChartPayload[];
  firstPriceKey: string;
  firstPriceColor: string;
  secondPriceKey: string;
  secondPriceColor: string;
  isFirstActive?: boolean;
}) => {
  const { classes } = useStyles();

  const [priceKey, setPriceKey] = useState(firstPriceKey);
  const [priceColor, setPriceColor] = useState(firstPriceColor);

  useEffect(() => {
    setPriceKey(isFirstActive ? firstPriceKey : secondPriceKey);
    setPriceColor(isFirstActive ? firstPriceColor : secondPriceColor);
  }, [isFirstActive, firstPriceKey, firstPriceColor, secondPriceKey, secondPriceColor]);

  const formatValue = (value: number) => {
    return priceToStringShort(value);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`${classes.customTooltip}`}>
          <p className="capitalize" style={{ color: "#C1C2C5" }}>{`${label}`}</p>
          {payload[0].payload[priceKey] && (
            <p style={{ color: "#909296" }}>
              <b>{priceKey}: </b>
              {`${priceToString(payload[0].payload[priceKey])}`}
            </p>
          )}
          {payload[0].payload["Average Rating"] && (
            <div style={{ color: "#909296" }} className="flex items-center">
              <div className="mr-1 font-bold">Average Rating: </div>
              {`${formatRatingTooltip(payload[0].payload["Average Rating"])}`}
              <IconStarFilled size="1rem" className="-mt-px ml-1" />
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <ResponsiveContainer width="100%" height={285}>
      <LineChart
        width={500}
        height={285}
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fill: "#C1C2C5", style: { fontSize: "0.8rem" } }} />
        <YAxis
          yAxisId="left"
          domain={["dataMax", "dataMin"]}
          tick={{ fill: "#C1C2C5", style: { fontSize: "0.8rem" } }}
          tickFormatter={formatValue}
          label={{
            value: "Price (€)",
            position: "outsideLeft",
            angle: 90,
            dy: -10,
            dx: 45,
            style: { textAnchor: "middle", fill: "#C1C2C5", fontSize: "1.05rem" },
          }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fill: "#C1C2C5", style: { fontSize: "0.8rem" } }}
          tickFormatter={(val) => (Number(val) / 2).toFixed(2).replaceAll(".", ",").replaceAll(",00", "")}
          domain={[1, 10]}
          label={{
            value: "Rating",
            position: "outsideRight",
            angle: -90,
            dy: -10,
            dx: -45,
            style: { textAnchor: "middle", fill: "#C1C2C5", fontSize: "1.05rem" },
          }}
        />

        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          yAxisId="right"
          orientation="right"
          connectNulls
          type="monotone"
          dataKey="Average Rating"
          stroke="#f59f00"
          fill="#f59f00"
          strokeWidth={3}
          dot={{ r: 3 }}
          activeDot={{ r: 6 }}
        />
        <Line
          yAxisId="left"
          orientation="left"
          connectNulls
          type="monotone"
          dataKey={priceKey}
          stroke={priceColor}
          fill={priceColor}
          strokeWidth={3}
          dot={{ r: 3 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default RWLineChart;

const useStyles = createStyles((theme) => ({
  customTooltip: {
    backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[8] : theme.white,
    padding: 10,
    borderRadius: 5,
    boxShadow: theme.shadows.sm,
  },
}));
