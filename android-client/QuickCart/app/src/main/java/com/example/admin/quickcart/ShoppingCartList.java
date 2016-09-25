package com.example.admin.quickcart;

import android.content.Intent;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.BaseAdapter;
import android.widget.ListAdapter;
import android.widget.ListView;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.net.URISyntaxException;
import java.util.ArrayList;

import java.net.URISyntaxException;
import java.util.Arrays;

import io.socket.client.IO;
import io.socket.client.Socket;
import io.socket.emitter.Emitter;


/**
 * Created by admin on 9/23/16.
 */
public class ShoppingCartList extends Fragment {

    private View rootView;
    private ArrayList<Item> itemsAll;
    private ArrayList<String> itemsNames;
    private int id;
    private String name;
    private String description;
    private double price;
    private int quantity;
    private ArrayAdapter shoppingCartListAdapter;
    private ListView shoppingCartListView;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        super.onCreateView(inflater, container, savedInstanceState);

        rootView = inflater.inflate(R.layout.shopping_cart_list, container, false);
        itemsAll = new ArrayList<>();
        itemsNames = new ArrayList<>();
        shoppingCartListView = (ListView) rootView.findViewById(R.id.shopping_cart_listview);
        shoppingCartListAdapter = new ArrayAdapter(getActivity().getBaseContext(),
                android.R.layout.simple_expandable_list_item_1,
                itemsNames) {
        };
        shoppingCartListView.setAdapter(shoppingCartListAdapter);

        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                updateList();
            }
        });

        try {
            Log.d("made socket 1", "");
            final Socket socket = IO.socket("http://quickcart.me"); //suspect the error is around here
            Log.d("made socket 2", "");
            socket.on(Socket.EVENT_CONNECT, new Emitter.Listener() {
                @Override
                public void call(Object... args) {
                    socket.emit("register inventory", 1);
                }

            }).on("inventory update", new Emitter.Listener() {

                @Override
                public void call(Object... args) {
                    Log.d("number of object args", "" + args.length);
                        final JSONObject myJSON = (JSONObject) args[0];
                        getActivity().runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                try {
                                    updateList(myJSON);
                                } catch (JSONException e) {
                                    e.printStackTrace();
                                }
                            }
                        });
                }
            });
            socket.connect();
        } catch (URISyntaxException e) {
            e.printStackTrace();
        }
        return rootView;
    }
    private void updateList(JSONObject jsonObject) throws JSONException {
        JSONArray jsonArray = jsonObject.getJSONArray("products");
        itemsNames.clear();
        itemsAll.clear();
        for (int i = 0; i < jsonArray.length(); i++) {
            try {
                id = (Integer) jsonArray.getJSONObject(i).get("id");
                name = jsonArray.getJSONObject(i).get("name").toString();
                Log.d("name of object", name);
                description = jsonArray.getJSONObject(i).getJSONObject("info").get("description").toString();
                price = Double.parseDouble(jsonArray.getJSONObject(i).get("price").toString());
                quantity = (Integer) jsonArray.getJSONObject(i).get("quantity");

                itemsNames.add(name);
                itemsAll.add(new Item(id, name, description, price, quantity));
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
        shoppingCartListAdapter.notifyDataSetChanged();
    }


    private void updateList() {

        new JSONRetriever(new OnTaskCompleted() {
            @Override
            public void onTaskCompleted(JSONObject jsonObject) throws JSONException {
                // This code will get called the moment the AsyncTask finishes
                JSONArray jsonArray = jsonObject.getJSONArray("products");
                for (int i = 0; i < jsonArray.length(); i++) {
                    try {
                        id = (Integer) jsonArray.getJSONObject(i).get("id");
                        name = jsonArray.getJSONObject(i).get("name").toString();
                        description = jsonArray.getJSONObject(i).getJSONObject("info").get("description").toString();
                        price = Double.parseDouble(jsonArray.getJSONObject(i).get("price").toString());
                        quantity = (Integer) jsonArray.getJSONObject(i).get("quantity");

                        itemsNames.add(name);
                        itemsAll.add(new Item(id, name, description, price, quantity));
                    } catch (JSONException e) {
                        e.printStackTrace();
                    }
                }

                shoppingCartListAdapter.notifyDataSetChanged();

                shoppingCartListView.setOnItemClickListener(new AdapterView.OnItemClickListener() {
                    @Override
                    public void onItemClick(AdapterView<?> parent, View view, int position, long id) {

                        startActivity(new Intent(getActivity().getApplicationContext(),
                                ItemScreen.class).putExtra("items", itemsAll).putExtra("position", position));
                    }
                });
            }
        }).execute("http://quickcart.me/inventories/1");
    }
}
