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
import android.widget.ListAdapter;
import android.widget.ListView;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;


/**
 * Created by admin on 9/23/16.
 */
public class ShoppingCartList extends Fragment {

    View rootView;
    ArrayList<String> items;
    JSONArray jsonArray;
    JSONObject jsonObject;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        super.onCreateView(inflater, container, savedInstanceState);

        rootView = inflater.inflate(R.layout.shopping_cart_list, container, false);
        items = new ArrayList<>();

        new JSONRetriever(new OnTaskCompleted() {
            @Override
            public void onTaskCompleted(JSONObject jsonObject) throws JSONException {
                // This code will get called the moment the AsyncTask finishes
                JSONArray jsonArray = jsonObject.getJSONArray("products");
                for (int i = 0; i < jsonArray.length(); i++) {
                    try {
                        Log.d("blah", jsonArray.getJSONObject(i).toString());
                        Log.d("length of this is ", Integer.toString(jsonArray.length()));
                        items.add(jsonArray.getJSONObject(i).toString());
                    } catch (JSONException e) {
                        e.printStackTrace();
                    }
                }

//        String[] filler = {"Pen", "Pencil"}; //Must fetch data from here

                ListAdapter shoppingCartListAdapter = new ArrayAdapter<String>(getActivity().getApplicationContext(),
                        android.R.layout.simple_expandable_list_item_1, items.toArray(new String[items.size()]));

                ListView shoppingCartListView = (ListView) rootView.findViewById(R.id.shopping_cart_listview);
                shoppingCartListView.setAdapter(shoppingCartListAdapter);

                shoppingCartListView.setOnItemClickListener(new AdapterView.OnItemClickListener() {
                    @Override
                    public void onItemClick(AdapterView<?> parent, View view, int position, long id) {

                        startActivity(new Intent(getActivity().getApplicationContext(), ItemScreen.class).putStringArrayListExtra("parameters", items));
                    }
                });
            }
        }).execute("http://quickcart.me/inventories/1");

        return rootView;
    }

}
